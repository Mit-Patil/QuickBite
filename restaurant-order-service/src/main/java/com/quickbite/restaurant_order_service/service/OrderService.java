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
import java.util.List;
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
    private final OrderItemRepository orderItemRepository;
    private final OrderItemAddonRepository orderItemAddonRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestClient paymentServiceClient;

    @Value("${order.tax-rate:0.05}")
    private BigDecimal taxRate;

    @Value("${order.delivery-fee:30.00}")
    private BigDecimal deliveryFee;

    @Transactional
    public OrderResponse placeOrder(UUID customerId,String authToken, PlaceOrderRequest request) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cart is empty"));

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
        BigDecimal taxAmount = subtotal.multiply(taxRate);
        BigDecimal totalAmount = subtotal.add(taxAmount).add(deliveryFee);

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
                .placedAt(order.getPlacedAt())
                .build();
    }
}