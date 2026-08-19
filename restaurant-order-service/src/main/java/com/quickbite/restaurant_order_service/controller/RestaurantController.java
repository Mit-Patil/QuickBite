package com.quickbite.restaurant_order_service.controller;

import com.quickbite.restaurant_order_service.dto.CreateRestaurantRequest;
import com.quickbite.restaurant_order_service.dto.RestaurantResponse;
import com.quickbite.restaurant_order_service.dto.UpdateRestaurantRequest;
import com.quickbite.restaurant_order_service.service.RestaurantService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.hibernate.grammars.hql.HqlParser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
public class RestaurantController {
    
    private final RestaurantService restaurantService;
    
    
    private UUID getCurrentUserId(){
        return (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
    
    @PostMapping
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantResponse> create(@Valid @RequestBody CreateRestaurantRequest request){
        RestaurantResponse response = restaurantService.createRestaurant(getCurrentUserId(), request);
        return ResponseEntity.status(201).body(response);
    }
    
    @GetMapping("/my")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<RestaurantResponse>> getMyRestaurants(){
        UUID ownerId = getCurrentUserId();
        return ResponseEntity.ok(restaurantService.getMyRestaurants(ownerId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponse> getById(@PathVariable UUID id){
        return ResponseEntity.ok(restaurantService.getById(id));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<RestaurantResponse> update(@PathVariable UUID id, @RequestBody UpdateRestaurantRequest request){
        RestaurantResponse response = restaurantService.updateRestaurant(id, getCurrentUserId(), request);
        return ResponseEntity.ok(response);
    }
    
}
