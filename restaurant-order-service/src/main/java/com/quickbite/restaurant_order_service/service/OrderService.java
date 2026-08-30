package com.quickbite.restaurant_order_service.service;

import com.quickbite.restaurant_order_service.dto.*;
import com.quickbite.restaurant_order_service.entity.*;
import com.quickbite.restaurant_order_service.entity.Order.OrderStatus;
import com.quickbite.restaurant_order_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CartItemAddonRepository cartItemAddonRepository;
    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemAddonRepository orderItemAddonRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestClient paymentServiceClient;

    @Value("${order.tax-rate:0.05}")
    private BigDecimal taxRate;

    @Value("${order.delivery-fee:30.00}")
    private BigDecimal deliveryFee;
    
    @Value("${internal.service-secret}")
    private String internalServiceSecret;

    @Transactional
    public OrderResponse placeOrder(UUID customerId,String authToken, PlaceOrderRequest request) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cart is empty"));
        
        if(cart.isProcessing()){
            throw new IllegalStateException("Your order is already being processed, please wait");
        }
        
        cart.setProcessing(true);
        cartRepository.save(cart);
        
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        
        

        // Step 1: validate (unchanged)
        for (CartItem cartItem : cartItems) {
            MenuItem menuItem = cartItem.getMenuItem();
            if (!menuItem.isAvailable()) {
                throw new IllegalStateException(menuItem.getName() + " is currently unavailable");
            }
            if (menuItem.getStockQuantity() != null && menuItem.getStockQuantity() < cartItem.getQuantity()) {
                throw new IllegalStateException("Not enough stock for " + menuItem.getName());
            }
        }

        // Step 1.5 (NEW): pre-fetch ALL addon links for ALL cart items, before any writes happen
        java.util.Map<UUID, List<CartItemAddon>> addonsByCartItemId = new java.util.HashMap<>();
        for (CartItem cartItem : cartItems) {
            addonsByCartItemId.put(cartItem.getId(), cartItemAddonRepository.findByIdCartItemId(cartItem.getId()));
        }

        // Step 2: create order shell (unchanged)
        Order order = Order.builder()
                .customerId(customerId)
                .restaurant(cart.getRestaurant())
                .deliveryAddressId(request.getDeliveryAddressId())
                .status(OrderStatus.PENDING)
                .subtotal(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .deliveryFee(deliveryFee)
                .totalAmount(BigDecimal.ZERO)
                .build();
        order = orderRepository.save(order);

        // Step 3: snapshot — now uses the PRE-FETCHED map instead of querying mid-loop
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            MenuItem menuItem = cartItem.getMenuItem();
            ItemVariant variant = cartItem.getVariant();

            BigDecimal unitPrice = variant != null ? variant.getPrice() : menuItem.getPrice();

            List<CartItemAddon> addonLinks = addonsByCartItemId.get(cartItem.getId());  // ← from the map, not a fresh query
            BigDecimal addonsTotal = addonLinks.stream()
                    .map(link -> link.getItemAddon().getPrice())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal lineTotal = unitPrice.add(addonsTotal).multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .itemName(menuItem.getName())
                    .variantName(variant != null ? variant.getName() : null)
                    .quantity(cartItem.getQuantity())
                    .specialInstructions(cartItem.getSpecialInstructions())
                    .unitPrice(unitPrice)
                    .addonsTotal(addonsTotal)
                    .lineTotal(lineTotal)
                    .build();
            orderItem = orderItemRepository.save(orderItem);

            for (CartItemAddon link : addonLinks) {
                OrderItemAddon orderItemAddon = OrderItemAddon.builder()
                        .orderItem(orderItem)
                        .addonName(link.getItemAddon().getName())
                        .addonPrice(link.getItemAddon().getPrice())
                        .build();
                orderItemAddonRepository.save(orderItemAddon);
            }

            if (menuItem.getStockQuantity() != null) {
                menuItem.setStockQuantity(menuItem.getStockQuantity() - cartItem.getQuantity());
                menuItemRepository.save(menuItem);
            }

            subtotal = subtotal.add(lineTotal);
        }

        // Step 4: finalize totals + status
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount).add(deliveryFee).setScale(2, RoundingMode.HALF_UP);

        order.setSubtotal(subtotal);
        order.setTaxAmount(taxAmount);
        order.setTotalAmount(totalAmount);
        order = orderRepository.save(order);

        // Step 5 (NEW): call payment-service     
        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setOrderId(order.getId().toString());
        paymentRequest.setRestaurantId(order.getRestaurant().getId().toString());
        paymentRequest.setAmount(totalAmount);
        paymentRequest.setMethod(request.getPaymentMethod());
        
        PaymentResponse paymentResponse;
        try {
            paymentResponse = paymentServiceClient.post()
                    .uri("/api/payments")
                    .header("Authorization", authToken)
                    .body(paymentRequest)
                    .retrieve()
                    .body(PaymentResponse.class);
        } catch (Exception e) {
            compensateFailedPayment(order, cartItems);
            cart.setProcessing(false);
            cartRepository.save(cart);
            throw new IllegalStateException("Payment could not be processed, please try again");
        }
        
        
        if ("SUCCESS".equals(paymentResponse.getStatus())) {
                order.setStatus(OrderStatus.CONFIRMED);
                order = orderRepository.save(order);
                cartItemRepository.deleteByCartId(cart.getId());
                cartRepository.delete(cart);
            } else {
                compensateFailedPayment(order, cartItems);
                order.setStatus(OrderStatus.PAYMENT_FAILED);
                order = orderRepository.save(order);
                cart.setProcessing(false);
                cartRepository.save(cart);
                throw new IllegalStateException("Payment failed: " + paymentResponse.getFailureReason());
            }

            return toResponse(order);
    }
    
    private void compensateFailedPayment(Order order, List<CartItem> cartItems) {
        for (CartItem cartItem : cartItems) {
            MenuItem menuItem = cartItem.getMenuItem();
            if (menuItem.getStockQuantity() != null) {
                menuItem.setStockQuantity(menuItem.getStockQuantity() + cartItem.getQuantity());
                menuItemRepository.save(menuItem);
            }
        }
    }

    public List<OrderResponse> getMyOrders(UUID customerId) {
        return orderRepository.findByCustomerIdOrderByPlacedAtDesc(customerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getById(UUID orderId, UUID customerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getCustomerId().equals(customerId)) {
            throw new IllegalArgumentException("This is not your order");
        }

        return toResponse(order);
    }
    
    public List<OrderResponse> getOrdersForRestaurant(UUID restaurantId, UUID ownerId){
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant Not Found"));
        
        if(!restaurant.getOwnerId().equals(ownerId)){
            throw new IllegalArgumentException("You do not own this restaurant");
        }
        
        return orderRepository.findByRestaurantIdOrderByPlacedAtDesc(restaurantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public OrderResponse updateOrderStatus(UUID orderId, UUID ownerId, UpdateOrderStatusRequest request){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if(!order.getRestaurant().getOwnerId().equals(ownerId)){
            throw new IllegalArgumentException("You do not own this order's restaurant");
        }
        
        OrderStatus newStatus;
        
        try {
            newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
             throw new IllegalArgumentException("Invalid status: " + request.getStatus());
        }
        
        validateStatusTransition(order.getStatus(), newStatus);
        
        order.setStatus(newStatus);
        order = orderRepository.save(order);
        return toResponse(order);
    }
    
    private void validateStatusTransition(OrderStatus current, OrderStatus next){
        Map<OrderStatus, List<OrderStatus>> allowedTransitions = Map.of(
            OrderStatus.CONFIRMED, List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
            OrderStatus.PREPARING, List.of(OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED),
            OrderStatus.READY_FOR_PICKUP, List.of(OrderStatus.OUT_FOR_DELIVERY),
            OrderStatus.OUT_FOR_DELIVERY, List.of(OrderStatus.DELIVERED)
        );
        
        List<OrderStatus> allowed = allowedTransitions.get(current);
        if(allowed == null || !allowed.contains(next)){
            throw  new IllegalStateException("Cannot transition order from " + current + " to " + next);
        }
    }

    public OrderResponse cancelOrder(UUID orderId, UUID ownerId, CancelOrderRequest request){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if(!order.getRestaurant().getOwnerId().equals(ownerId)){
            throw new IllegalArgumentException("You do not own this order's restaurant");
        }
        
        validateStatusTransition(order.getStatus(), OrderStatus.CANCELLED);
        
        if(order.getStatus() == OrderStatus.CONFIRMED 
                || order.getStatus() == OrderStatus.PREPARING
                || order.getStatus() == OrderStatus.READY_FOR_PICKUP){
            try {
                paymentServiceClient.post()
                        .uri("/api/payments/{orderId}/refund", order.getId())
                        .header("X-Internal-Key", internalServiceSecret)
                        .retrieve()
                        .toBodilessEntity();
            } catch (Exception e) {
                    System.err.println("Refund failed for order " + order.getId() + ": " + e.getMessage());
            }
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(request.getReason());
        order = orderRepository.save(order);
        return toResponse(order);
    }
    
    private OrderResponse toResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> {
                    List<OrderItemAddonResponse> addons = orderItemAddonRepository.findByOrderItemId(item.getId())
                            .stream()
                            .map(a -> OrderItemAddonResponse.builder()
                                    .addonName(a.getAddonName())
                                    .addonPrice(a.getAddonPrice())
                                    .build())
                            .collect(Collectors.toList());

                    return OrderItemResponse.builder()
                            .itemName(item.getItemName())
                            .variantName(item.getVariantName())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .addons(addons)
                            .addonsTotal(item.getAddonsTotal())
                            .lineTotal(item.getLineTotal())
                            .specialInstructions(item.getSpecialInstructions())
                            .build();
                })
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .restaurantName(order.getRestaurant().getName())
                .status(order.getStatus().name())
                .items(itemResponses)
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .deliveryFee(order.getDeliveryFee())
                .totalAmount(order.getTotalAmount())
                .cancellationReason(order.getCancellationReason())
                .placedAt(order.getPlacedAt())
                .build();
    }
}