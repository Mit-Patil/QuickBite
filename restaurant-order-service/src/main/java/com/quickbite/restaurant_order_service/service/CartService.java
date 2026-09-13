package com.quickbite.restaurant_order_service.service;

import com.quickbite.restaurant_order_service.dto.AddToCartRequest;
import com.quickbite.restaurant_order_service.dto.CartItemResponse;
import com.quickbite.restaurant_order_service.dto.CartResponse;
import com.quickbite.restaurant_order_service.entity.Cart;
import com.quickbite.restaurant_order_service.entity.CartItem;
import com.quickbite.restaurant_order_service.entity.CartItemAddon;
import com.quickbite.restaurant_order_service.entity.CartItemAddonId;
import com.quickbite.restaurant_order_service.entity.ItemAddon;
import com.quickbite.restaurant_order_service.entity.ItemVariant;
import com.quickbite.restaurant_order_service.entity.MenuItem;
import com.quickbite.restaurant_order_service.repository.CartItemAddonRepository;
import com.quickbite.restaurant_order_service.repository.CartItemRepository;
import com.quickbite.restaurant_order_service.repository.CartRepository;
import com.quickbite.restaurant_order_service.repository.ItemAddonRepository;
import com.quickbite.restaurant_order_service.repository.ItemVariantRepository;
import com.quickbite.restaurant_order_service.repository.MenuItemRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {
    
    private final CartRepository cartRepository;
    private final CartItemAddonRepository cartItemAddonRepository;
    private final CartItemRepository cartItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final ItemVariantRepository itemVariantRepository;
    private final ItemAddonRepository itemAddonRepository;
    
    
    public CartResponse addToCart(UUID customerId, AddToCartRequest request){
        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> new IllegalArgumentException("Menu Item Not Found"));
        
        if (!menuItem.getRestaurant().isOpen()) {
            throw new IllegalArgumentException("This restaurant is currently closed");
        }

        if (!menuItem.isAvailable()) {
            throw new IllegalArgumentException("This item is currently unavailable");
        }

        if (!menuItem.isStockUnlimited() && menuItem.getStockQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException("Only " + menuItem.getStockQuantity() + " left in stock");
        }
        
        Cart cart = cartRepository.findByCustomerId(customerId).orElse(null);
        
        
        if(cart == null){
            cart = Cart.builder()
                    .customerId(customerId)
                    .restaurant(menuItem.getRestaurant())
                    .build();
            cart = cartRepository.save(cart);
        }else if(!cart.getRestaurant().getId().equals(menuItem.getRestaurant().getId())){
            throw new IllegalArgumentException("Your cart contains items from another restaurant. Clear your cart to order from here.");
        }
        
        ItemVariant variant = null;
        if(request.getVariantId() != null){
            variant = itemVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new IllegalArgumentException("Variant Not Found"));
        }
        
         List<UUID> requestedAddonIds = request.getAddonIds() != null
            ? request.getAddonIds().stream().sorted().collect(Collectors.toList())
            : List.of();
         
         List<CartItem> existingItems = cartItemRepository.findByCartId(cart.getId());
            for (CartItem existing : existingItems) {
                boolean sameMenuItem = existing.getMenuItem().getId().equals(menuItem.getId());
                boolean sameVariant = (existing.getVariant() == null && variant == null)
                        || (existing.getVariant() != null && variant != null && existing.getVariant().getId().equals(variant.getId()));

                if (sameMenuItem && sameVariant) {
                    List<UUID> existingAddonIds = cartItemAddonRepository.findByIdCartItemId(existing.getId())
                            .stream()
                            .map(link -> link.getItemAddon().getId())
                            .sorted()
                            .collect(Collectors.toList());

                    if (existingAddonIds.equals(requestedAddonIds)) {
                        existing.setQuantity(existing.getQuantity() + request.getQuantity());
                        cartItemRepository.save(existing);
                        return getCart(customerId);
                    }
                }
            }
        
        CartItem cartItem = CartItem.builder()
                .cart(cart)
                .menuItem(menuItem)
                .variant(variant)
                .quantity(request.getQuantity())
                .specialInstructions(request.getSpecialInstructions())
                .build();
        cartItem = cartItemRepository.save(cartItem);
        
        if(request.getAddonIds() != null){
            for (UUID addonId: request.getAddonIds()){
                ItemAddon addon = itemAddonRepository.findById(addonId)
                        .orElseThrow(() -> new IllegalArgumentException("Addon Not Found"));
                
                CartItemAddonId id = new CartItemAddonId(cartItem.getId(), addon.getId());
                CartItemAddon cartItemAddon = CartItemAddon.builder()
                        .id(id)
                        .cartItem(cartItem)
                        .itemAddon(addon)
                        .build();
                cartItemAddonRepository.save(cartItemAddon);
            }
        }
        return getCart(customerId);
        
    }
    
    public CartResponse getCart(UUID customerId){
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cart is empty"));
        
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        
        List<CartItemResponse> itemResponse = items.stream()
                .map(this::toCartItemResponse)
                .collect(Collectors.toList());
        
        BigDecimal subtotal = itemResponse.stream()
                .map(CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return CartResponse.builder()
                .id(cart.getId())
                .restaurantId(cart.getRestaurant().getId())
                .restaurantName(cart.getRestaurant().getName())
                .items(itemResponse)
                .subtotal(subtotal)
                .build();
    }
    
    @Transactional
    public void removeCartItem(UUID customerId, UUID cartItemId){
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        
        
        if(!item.getCart().getCustomerId().equals(customerId)){
            throw new IllegalArgumentException("This is not your cart item");
        }
        
        Cart cart = item.getCart();
        cartItemRepository.deleteById(cartItemId);
        
        boolean anyItemsLeft = !cartItemRepository.findByCartId(cart.getId()).isEmpty();
        if(!anyItemsLeft){
            cartRepository.delete(cart);
        }
    }
    
    @Transactional
    public void clearCart(UUID customerId) {
        Cart cart = cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cart is empty"));

        cartItemRepository.deleteByCartId(cart.getId());
        cartRepository.delete(cart);
    }
    
    private CartItemResponse toCartItemResponse(CartItem item){
        BigDecimal unitPrice = item.getVariant() != null
                ? item.getVariant().getPrice()
                :item.getMenuItem().getPrice();
        
        List<CartItemAddon> addonLinks = cartItemAddonRepository.findByIdCartItemId(item.getId());
        
        List<String> addonNames = addonLinks.stream()
                .map(link -> link.getItemAddon().getName())
                .collect(Collectors.toList());
        
        BigDecimal addonsTotal = addonLinks.stream()
                .map(link -> link.getItemAddon().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        
        BigDecimal lineTotal = unitPrice.add(addonsTotal).multiply(BigDecimal.valueOf(item.getQuantity()));
        
        return CartItemResponse.builder()
                .id(item.getId())
                .menuItemName(item.getMenuItem().getName())
                .unitPrice(unitPrice)
                .variantName(item.getVariant() != null ? item.getVariant().getName() : null)
                .selectedAddonNames(addonNames)
                .addonsTotal(addonsTotal)
                .quantity(item.getQuantity())
                .specialInstructions(item.getSpecialInstructions())
                .lineTotal(lineTotal)
                .build();
    }
    
}
