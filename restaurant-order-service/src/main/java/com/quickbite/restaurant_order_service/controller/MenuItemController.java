package com.quickbite.restaurant_order_service.controller;

import com.quickbite.restaurant_order_service.dto.*;
import com.quickbite.restaurant_order_service.service.MenuItemService;
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
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    @PostMapping("/api/restaurants/{restaurantId}/menu-items")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItemResponse> create(@PathVariable UUID restaurantId, @Valid @RequestBody CreateMenuItemRequest request) {
        UUID ownerId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.createMenuItem(restaurantId, ownerId, request));
    }

    @GetMapping("/api/restaurants/{restaurantId}/menu-items")
    public ResponseEntity<List<MenuItemResponse>> getMenu(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(menuItemService.getMenuForRestaurant(restaurantId));
    }

    @GetMapping("/api/menu-items/{id}")
    public ResponseEntity<MenuItemResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(menuItemService.getById(id));
    }

    @PutMapping("/api/menu-items/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItemResponse> update(@PathVariable UUID id, @RequestBody UpdateMenuItemRequest request) {
        UUID ownerId = getCurrentUserId();
        return ResponseEntity.ok(menuItemService.updateMenuItem(id, ownerId, request));
    }

    @PostMapping("/api/menu-items/{id}/variants")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ItemVariantResponse> addVariant(@PathVariable UUID id, @Valid @RequestBody CreateItemVariantRequest request) {
        UUID ownerId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.addVariant(id, ownerId, request));
    }

    @PostMapping("/api/restaurants/{restaurantId}/addons")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ItemAddonResponse> createAddon(@PathVariable UUID restaurantId, @Valid @RequestBody CreateItemAddonRequest request) {
        UUID ownerId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.createAddon(restaurantId, ownerId, request));
    }

    @PostMapping("/api/menu-items/{id}/addons")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Void> attachAddon(@PathVariable UUID id, @Valid @RequestBody AttachAddonRequest request) {
        UUID ownerId = getCurrentUserId();
        menuItemService.attachAddon(id, ownerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    @GetMapping("/api/restaurants/{restaurantId}/addons")
    public ResponseEntity<List<ItemAddonResponse>> getAddons(@PathVariable UUID restaurantId) {
        return ResponseEntity.ok(menuItemService.getAddonsForRestaurant(restaurantId));
    }
    
    
    @PutMapping("/api/menu-items/{itemId}/variants/{variantId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ItemVariantResponse> updateVariant(@PathVariable UUID itemId, @PathVariable UUID variantId, @Valid @RequestBody UpdateItemVariantRequest request){
        UUID ownerId = getCurrentUserId();
        return ResponseEntity.ok(menuItemService.updateVariant(variantId, ownerId, request));
    }
    
    @DeleteMapping("/api/menu-items/{itemId}/variants/{variantId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Void> removeVariant(@PathVariable UUID itemId, @PathVariable UUID variantId){
        UUID ownerId = getCurrentUserId();
        menuItemService.deleteVariant(variantId, ownerId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/api/restaurants/{restaurantId}/addons/{addonId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<ItemAddonResponse> updateAddons(@PathVariable UUID addonId,@Valid @RequestBody UpdateItemAddonRequest request){
        UUID ownerId = getCurrentUserId();
        return ResponseEntity.ok(menuItemService.updateAddon(addonId, ownerId, request));
    }
    
    @DeleteMapping("/api/menu-items/{itemId}/addons/{addonId}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Void> detachAddon(@PathVariable UUID itemId,@PathVariable UUID addonId){
        UUID ownerId = getCurrentUserId();
        menuItemService.detachAddon(itemId, addonId, ownerId);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        return (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}