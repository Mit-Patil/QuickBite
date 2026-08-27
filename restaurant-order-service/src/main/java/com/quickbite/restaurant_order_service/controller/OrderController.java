package com.quickbite.restaurant_order_service.controller;

import com.quickbite.restaurant_order_service.dto.*;
import com.quickbite.restaurant_order_service.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody PlaceOrderRequest request) {
        UUID customerId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(customerId, authHeader, request));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        UUID customerId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getMyOrders(customerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getById(@PathVariable UUID id) {
        UUID customerId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getById(id, customerId));
    }

    private UUID getCurrentUserId() {
        return (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}