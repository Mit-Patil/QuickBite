package com.quickbite.restaurant_order_service.controller;

import com.quickbite.restaurant_order_service.dto.AddToCartRequest;
import com.quickbite.restaurant_order_service.dto.CartResponse;
import com.quickbite.restaurant_order_service.service.CartService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    private final CartService cartService;
    
    
    private UUID getCurrentUserId(){
        return (UUID)SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
    
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(@Valid @RequestBody AddToCartRequest request){
        UUID customerId = getCurrentUserId();
        CartResponse response = cartService.addToCart(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<CartResponse> getCart(){
        UUID customerId = getCurrentUserId();
        return ResponseEntity.ok(cartService.getCart(customerId));
    }
    
    
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<Void> removeItem(@PathVariable UUID cartItemId){
        UUID customerId = getCurrentUserId();
        cartService.removeCartItem(customerId, cartItemId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping
    public ResponseEntity<Void> clearCart(){
        UUID customerId = getCurrentUserId();
        cartService.clearCart(customerId);
        return ResponseEntity.noContent().build();
    }
}
