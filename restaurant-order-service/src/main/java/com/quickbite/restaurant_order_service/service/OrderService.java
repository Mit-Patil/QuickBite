package com.quickbite.restaurant_order_service.service;

import com.quickbite.restaurant_order_service.dto.*;
import com.quickbite.restaurant_order_service.entity.*;
import com.quickbite.restaurant_order_service.entity.Order.OrderStatus;
import com.quickbite.restaurant_order_service.event.OrderEventPublisher;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private final OrderEventPublisher orderEventPublisher;
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    
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
            if (!menuItem.isStockUnlimited() && menuItem.getStockQuantity() < cartItem.getQuantity()) {
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

            if (!menuItem.isStockUnlimited()) {
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
        String idempotencyKey = order.getId().toString();
        
        
        // Step 5 (NEW): call payment-service     
        PaymentRequest paymentRequest = new PaymentRequest();
        paymentRequest.setOrderId(order.getId().toString());
        paymentRequest.setRestaurantId(order.getRestaurant().getId().toString());
        paymentRequest.setAmount(totalAmount);
        paymentRequest.setMethod(request.getPaymentMethod());
        paymentRequest.setIdempotencyKey(idempotencyKey);
        
        PaymentResponse paymentResponse;
        try {
            paymentResponse = paymentServiceClient.post()
                    .uri("/api/payments")
                    .header("Authorization", authToken)
                    .body(paymentRequest)
                    .retrieve()
                    .body(PaymentResponse.class);
        } catch (Exception e) {
            
            
            System.err.println("Payment call failed/timed out, checking real status for key: " + idempotencyKey);
            
            PaymentStatusResponse actualStatus = null;
            try {
                actualStatus = paymentServiceClient.get()
                        .uri("/api/payments/status/{key}", idempotencyKey)
                        .header("X-Internal-Key", internalServiceSecret)
                        .retrieve()
                        .body(PaymentStatusResponse.class);
            } catch (Exception statusCheckException) {
                System.err.println("Status check also failed, assuming payment never succeeded: "+ statusCheckException.getMessage());
            }
            
            if(actualStatus !=null && "SUCCESS".equals(actualStatus.getStatus())){
                System.err.println("Reconciliation found payment DID succeed for key: " + idempotencyKey);
                order.setStatus(OrderStatus.CONFIRMED);
                order = orderRepository.save(order);
                List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
                for (CartItem item : items) {
                    cartItemAddonRepository.deleteByIdCartItemId(item.getId());
                }
                cartItemRepository.deleteByCartId(cart.getId());
                cartRepository.delete(cart);
                
                orderEventPublisher.publish(OrderEvent.builder()
                .eventType("ORDER_CONFIRMED")
                .orderId(order.getId())
                .customerId(order.getCustomerId())
                .restaurantId(order.getRestaurant().getId())
                .status(order.getStatus().name())
                .previousStatus(OrderStatus.PENDING.name())
                .totalAmount(order.getTotalAmount())
                .occurredAt(java.time.Instant.now())
                .build());
                return toResponse(order);
            }
            
            
            compensateFailedPayment(order, cartItems);
            cart.setProcessing(false);
            cartRepository.save(cart);
            throw new IllegalStateException("Payment could not be processed, please try again");
        }
        
        
        if ("SUCCESS".equals(paymentResponse.getStatus())) {
                order.setStatus(OrderStatus.CONFIRMED);
                order = orderRepository.save(order);
                List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
                for (CartItem item : items) {
                    cartItemAddonRepository.deleteByIdCartItemId(item.getId());
                }
                cartItemRepository.deleteByCartId(cart.getId());
                cartRepository.delete(cart);
                
                orderEventPublisher.publish(OrderEvent.builder()
                        .eventType("ORDER_CONFIRMED")
                        .orderId(order.getId())
                        .customerId(order.getCustomerId())
                        .restaurantId(order.getRestaurant().getId())
                        .status(order.getStatus().name())
                        .previousStatus(OrderStatus.PENDING.name())
                        .totalAmount(order.getTotalAmount())
                        .occurredAt(java.time.Instant.now())
                        .build()
                );
            } else {
                compensateFailedPayment(order, cartItems);
                order.setStatus(OrderStatus.PAYMENT_FAILED);
                order = orderRepository.save(order);
                cart.setProcessing(false);
                cartRepository.save(cart);
                
                orderEventPublisher.publish(OrderEvent.builder()
                .eventType("PAYMENT_FAILED")
                .orderId(order.getId())
                .customerId(order.getCustomerId())
                .restaurantId(order.getRestaurant().getId())
                .status(order.getStatus().name())
                .previousStatus(OrderStatus.PENDING.name())
                .occurredAt(java.time.Instant.now())
                .build());
                
                throw new IllegalStateException("Payment failed: " + paymentResponse.getFailureReason());
            }

            return toResponse(order);
    }
    
    private void compensateFailedPayment(Order order, List<CartItem> cartItems) {
        for (CartItem cartItem : cartItems) {
            MenuItem menuItem = cartItem.getMenuItem();
            if (!menuItem.isStockUnlimited()) {
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
    
    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, UUID ownerId, UpdateOrderStatusRequest request){
        Order order = orderRepository.findWithLockById(orderId)
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

        if (newStatus == OrderStatus.ACCEPTED || newStatus == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Use the accept or cancel endpoint for this change");
        }
        
        validateStatusTransition(order.getStatus(), newStatus);
        
        if (newStatus == OrderStatus.PREPARING && order.getDeliveryPartnerId() == null) {
            throw new IllegalStateException("Waiting for a delivery partner to be assigned");
        }
        
        return toResponse(applyStatusChange(order, newStatus));
    }
    
    private void validateStatusTransition(OrderStatus current, OrderStatus next){
        Map<OrderStatus, List<OrderStatus>> allowedTransitions = Map.of(
            OrderStatus.CONFIRMED, List.of(OrderStatus.ACCEPTED, OrderStatus.CANCELLED),
            OrderStatus.ACCEPTED, List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
            OrderStatus.PREPARING, List.of(OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED),
            OrderStatus.READY_FOR_PICKUP, List.of(OrderStatus.OUT_FOR_DELIVERY),
            OrderStatus.OUT_FOR_DELIVERY, List.of(OrderStatus.DELIVERED)
        );
        
        List<OrderStatus> allowed = allowedTransitions.get(current);
        if(allowed == null || !allowed.contains(next)){
            throw  new IllegalStateException("Cannot transition order from " + current + " to " + next);
        }
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID ownerId, CancelOrderRequest request){
        Order order = orderRepository.findWithLockById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if(!order.getRestaurant().getOwnerId().equals(ownerId)){
            throw new IllegalArgumentException("You do not own this order's restaurant");
        }        
        return toResponse(applyCancellation(order, request.getReason()));
    }
    
     private Order applyCancellation(Order order, String reason) {
        OrderStatus previousStatus = order.getStatus();
        validateStatusTransition(previousStatus, OrderStatus.CANCELLED);

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem orderItem : orderItems) {
            MenuItem menuItem = orderItem.getMenuItem();
            if (!menuItem.isStockUnlimited()) {
                menuItem.setStockQuantity(menuItem.getStockQuantity() + orderItem.getQuantity());
                menuItemRepository.save(menuItem);
            }
        }

        if (previousStatus == OrderStatus.CONFIRMED
                || previousStatus == OrderStatus.ACCEPTED
                || previousStatus == OrderStatus.PREPARING) {
            try {
                paymentServiceClient.post()
                        .uri("/api/payments/{orderId}/refund", order.getId())
                        .header("X-Internal-Key", internalServiceSecret)
                        .retrieve()
                        .toBodilessEntity();
            } catch (Exception e) {
                log.error("Refund failed for order {}: {}", order.getId(), e.getMessage());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        order = orderRepository.save(order);

        orderEventPublisher.publish(OrderEvent.builder()
                .eventType("ORDER_CANCELLED")
                .orderId(order.getId())
                .customerId(order.getCustomerId())
                .restaurantId(order.getRestaurant().getId())
                .status(OrderStatus.CANCELLED.name())
                .previousStatus(previousStatus.name())
                .cancellationReason(reason)
                .occurredAt(java.time.Instant.now())
                .build());

        return order;
    }
     
    @Transactional
    public void cancelUnansweredOrder(UUID orderId) {
        Order order = orderRepository.findWithLockById(orderId).orElse(null);
        if (order == null) {
            log.warn("Unknown order {} in timeout sweep, ignoring", orderId);
            return;
        }
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            log.info("Order {} is {}, not timing out", orderId, order.getStatus());
            return;
        }
        applyCancellation(order, "Restaurant did not respond in time");
        log.info("Order {} auto-cancelled: restaurant did not respond", orderId);
    }
     
     @Transactional
     public OrderResponse acceptOrder(UUID orderId, UUID ownerId){
         Order order = orderRepository.findWithLockById(orderId)
                 .orElseThrow(() -> new IllegalArgumentException("Order not found"));
         
         if(!order.getRestaurant().getOwnerId().equals(ownerId)){
            throw new IllegalArgumentException("You do not own this order's restaurant");
         }
         
         validateStatusTransition(order.getStatus(), OrderStatus.ACCEPTED);
         
         OrderStatus previousStatus = order.getStatus();
         order.setStatus(OrderStatus.ACCEPTED);
         
         order = orderRepository.save(order);
         
         orderEventPublisher.publish(OrderEvent.builder()
                 .eventType("ORDER_ACCEPTED")
                 .orderId(order.getId())
                 .customerId(order.getCustomerId())
                 .restaurantId(order.getRestaurant().getId())
                 .status(OrderStatus.ACCEPTED.name())
                 .previousStatus(previousStatus.name())
                 .occurredAt(java.time.Instant.now())
                 .build());
         return toResponse(order);
     }
     
     @Transactional
     public OrderResponse rejectOrder(UUID orderID, UUID ownerId, CancelOrderRequest request){
         Order order = orderRepository.findWithLockById(orderID)
                 .orElseThrow(() -> new IllegalArgumentException("Order not found"));
         
         if(!order.getRestaurant().getOwnerId().equals(ownerId)){
             throw new IllegalArgumentException("You do not own this order's restaurant");
         }
         
         if(order.getStatus() != OrderStatus.CONFIRMED){
             throw new IllegalStateException("Only an order waiting for the restaurant can be rejected");
         }
         return toResponse(applyCancellation(order, "Rejected by restaurant: " + request.getReason()));
     }
    
    @Transactional
    public void assignDeliveryPartner(UUID orderId, UUID partnerId) {
        Order order = orderRepository.findWithLockById(orderId).orElse(null);
        if (order == null) {
            log.warn("DELIVERY_ASSIGNED for unknown order {}, ignoring", orderId);
            return;
        }
        if (order.getStatus() == Order.OrderStatus.CANCELLED
                || order.getStatus() == Order.OrderStatus.PAYMENT_FAILED) {
            log.warn("Order {} is {}, not assigning partner {}", orderId, order.getStatus(), partnerId);
            return;
        }
        if (partnerId.equals(order.getDeliveryPartnerId())) {
            return;
        }
        order.setDeliveryPartnerId(partnerId);
        orderRepository.save(order);
        log.info("Assigned partner {} to order {}", partnerId, orderId);
    }
    
    @Transactional
    public void cancelForNoPartner(UUID orderId) {
        Order order = orderRepository.findWithLockById(orderId).orElse(null);
        if (order == null) {
            log.warn("NO_PARTNER_FOUND for unknown order {}, ignoring", orderId);
            return;
        }
        if (order.getStatus() != Order.OrderStatus.ACCEPTED) {
            log.info("Order {} is {}, not auto-cancelling", orderId, order.getStatus());
            return;
        }
        applyCancellation(order, "No delivery partner available");
        log.info("Order {} auto-cancelled: no delivery partner found", orderId);
    }
    
    @Transactional
    public OrderResponse pickUpOrder(UUID orderId, UUID partnerId) {
        return changeStatusAsPartner(orderId, partnerId, OrderStatus.OUT_FOR_DELIVERY);
    }

    @Transactional
    public OrderResponse deliverOrder(UUID orderId, UUID partnerId) {
        return changeStatusAsPartner(orderId, partnerId, OrderStatus.DELIVERED);
    }

    private OrderResponse changeStatusAsPartner(UUID orderId, UUID partnerId, OrderStatus target) {
        Order order = orderRepository.findWithLockById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!partnerId.equals(order.getDeliveryPartnerId())) {
            throw new IllegalArgumentException("This is not your delivery");
        }
        if (order.getStatus() == target) {
            return toResponse(order); 
        }
        validateStatusTransition(order.getStatus(), target);
        return toResponse(applyStatusChange(order, target));
    }

    private Order applyStatusChange(Order order, OrderStatus newStatus) {
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(newStatus);
        order = orderRepository.save(order);

        orderEventPublisher.publish(OrderEvent.builder()
                .eventType("STATUS_CHANGED")
                .orderId(order.getId())
                .customerId(order.getCustomerId())
                .restaurantId(order.getRestaurant().getId())
                .status(newStatus.name())
                .previousStatus(previousStatus.name())
                .occurredAt(java.time.Instant.now())
                .build());
        return order;
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
                .deliveryPartnerId(order.getDeliveryPartnerId())
                .build();
    }
}