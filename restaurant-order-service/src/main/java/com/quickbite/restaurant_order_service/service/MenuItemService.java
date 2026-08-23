package com.quickbite.restaurant_order_service.service;

import com.quickbite.restaurant_order_service.dto.AttachAddonRequest;
import com.quickbite.restaurant_order_service.dto.CreateItemAddonRequest;
import com.quickbite.restaurant_order_service.dto.CreateItemVariantRequest;
import com.quickbite.restaurant_order_service.dto.CreateMenuItemRequest;
import com.quickbite.restaurant_order_service.dto.ItemAddonResponse;
import com.quickbite.restaurant_order_service.dto.ItemVariantResponse;
import com.quickbite.restaurant_order_service.dto.MenuItemResponse;
import com.quickbite.restaurant_order_service.dto.UpdateMenuItemRequest;
import com.quickbite.restaurant_order_service.entity.ItemAddon;
import com.quickbite.restaurant_order_service.entity.ItemVariant;
import com.quickbite.restaurant_order_service.entity.MenuItem;
import com.quickbite.restaurant_order_service.entity.MenuItemAddon;
import com.quickbite.restaurant_order_service.entity.MenuItemAddonId;
import com.quickbite.restaurant_order_service.entity.Restaurant;
import com.quickbite.restaurant_order_service.repository.ItemAddonRepository;
import com.quickbite.restaurant_order_service.repository.ItemVariantRepository;
import com.quickbite.restaurant_order_service.repository.MenuItemAddonRepository;
import com.quickbite.restaurant_order_service.repository.MenuItemRepository;
import com.quickbite.restaurant_order_service.repository.RestaurantRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class MenuItemService {
    
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final ItemVariantRepository itemVariantRepository;
    private final ItemAddonRepository itemAddonRepository;
    private final MenuItemAddonRepository menuItemAddonRepository;
    
    
    public MenuItemResponse createMenuItem(UUID restuarantId, UUID ownerId, CreateMenuItemRequest request){
        
        Restaurant restaurant = restaurantRepository.findById(restuarantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant Not Found"));
        
        if(!restaurant.getOwnerId().equals(ownerId)){
            throw new IllegalArgumentException("You Do Not Own this Restaurant");
        }
        
        
        MenuItem item = MenuItem.builder()
                .restaurant(restaurant)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .isVeg(request.isVeg())
                .isAvailable(true)
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .build();
        

            
         MenuItem saved = menuItemRepository.save(item);
         
         return toResponse(saved);
        
    }
    
    public List<MenuItemResponse> getMenuForRestaurant(UUID restaurantId){
            return menuItemRepository.findByRestaurantId(restaurantId)
                    .stream()
                    .map(this :: toResponse)
                    .collect(Collectors.toList());
    }
    
    public MenuItemResponse getById(UUID menuItemId){
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new IllegalArgumentException("Menu Item Not Found"));
        return toResponse(item);
    }
    
     public MenuItemResponse updateMenuItem(UUID menuItemId, UUID ownerId, UpdateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));

        if (!item.getRestaurant().getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You do not own this menu item");
        }

        if (request.getName() != null) item.setName(request.getName());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getPrice() != null) item.setPrice(request.getPrice());
        if (request.getCategory() != null) item.setCategory(request.getCategory());
        if (request.getIsVeg() != null) item.setVeg(request.getIsVeg());
        if (request.getIsAvailable() != null) item.setAvailable(request.getIsAvailable());
        if (request.getStockQuantity() != null) item.setStockQuantity(request.getStockQuantity());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());

        MenuItem saved = menuItemRepository.save(item);
        return toResponse(saved);
    }
     
     
      public ItemVariantResponse addVariant(UUID menuItemId, UUID ownerId, CreateItemVariantRequest request) {
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));

        if (!item.getRestaurant().getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You do not own this menu item");
        }

        ItemVariant variant = ItemVariant.builder()
                .menuItem(item)
                .name(request.getName())
                .price(request.getPrice())
                .isDefault(request.isDefault())
                .build();

        ItemVariant saved = itemVariantRepository.save(variant);
        return ItemVariantResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .price(saved.getPrice())
                .isDefault(saved.isDefault())
                .build();
    }

    public ItemAddonResponse createAddon(UUID restaurantId, UUID ownerId, CreateItemAddonRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));

        if (!restaurant.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You do not own this restaurant");
        }

        ItemAddon addon = ItemAddon.builder()
                .restaurant(restaurant)
                .name(request.getName())
                .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                .build();

        ItemAddon saved = itemAddonRepository.save(addon);
        return ItemAddonResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .price(saved.getPrice())
                .isAvailable(saved.isAvailable())
                .build();
    }

    public void attachAddon(UUID menuItemId, UUID ownerId, AttachAddonRequest request) {
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));

        if (!item.getRestaurant().getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You do not own this menu item");
        }

        ItemAddon addon = itemAddonRepository.findById(request.getAddonId())
                .orElseThrow(() -> new IllegalArgumentException("Addon not found"));

        if (!addon.getRestaurant().getId().equals(item.getRestaurant().getId())) {
            throw new IllegalArgumentException("This addon does not belong to this restaurant");
        }

        MenuItemAddonId id = new MenuItemAddonId(item.getId(), addon.getId());
        MenuItemAddon link = MenuItemAddon.builder()
                .id(id)
                .menuItem(item)
                .itemAddon(addon)
                .build();
        menuItemAddonRepository.save(link);
    }

    private MenuItemResponse toResponse(MenuItem item) {
        List<ItemVariantResponse> variants = itemVariantRepository.findByMenuItemId(item.getId())
                .stream()
                .map(v -> ItemVariantResponse.builder()
                        .id(v.getId()).name(v.getName()).price(v.getPrice()).isDefault(v.isDefault())
                        .build())
                .collect(Collectors.toList());

            List<ItemAddonResponse> addons = menuItemAddonRepository.findByIdMenuItemId(item.getId())
                    .stream()
                    .map(link -> {
                        ItemAddon a = link.getItemAddon();
                        return ItemAddonResponse.builder()
                                .id(a.getId()).name(a.getName()).price(a.getPrice()).isAvailable(a.isAvailable())
                                .build();
                    })
                    .collect(Collectors.toList());

            return MenuItemResponse.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .description(item.getDescription())
                    .price(item.getPrice())
                    .category(item.getCategory())
                    .isVeg(item.isVeg())
                    .isAvailable(item.isAvailable())
                    .stockQuantity(item.getStockQuantity())
                    .imageUrl(item.getImageUrl())
                    .variants(variants)
                    .addons(addons)
                    .build();
    }
}

