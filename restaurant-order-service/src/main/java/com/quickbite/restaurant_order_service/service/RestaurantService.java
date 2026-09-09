package com.quickbite.restaurant_order_service.service;

import com.quickbite.restaurant_order_service.dto.CreateRestaurantRequest;
import com.quickbite.restaurant_order_service.dto.RestaurantResponse;
import com.quickbite.restaurant_order_service.dto.UpdateRestaurantRequest;
import com.quickbite.restaurant_order_service.entity.Restaurant;
import com.quickbite.restaurant_order_service.entity.Restaurant.RestaurantType;
import com.quickbite.restaurant_order_service.repository.RestaurantRepository;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class RestaurantService {
    
    private final RestaurantRepository restaurantRepository;
    
    public RestaurantResponse createRestaurant(UUID ownerId, CreateRestaurantRequest request){
    
        Restaurant restaurant = Restaurant.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .description(request.getDescription())
                .cuisineType(request.getCuisineType())
                .restaurantType(RestaurantType.valueOf(request.getRestaurantType().toUpperCase()))
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .pincode(request.getPincode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .twentyFourSeven(request.isTwentyFourSeven())
                .openingTime(request.getOpeningTime() != null ? LocalTime.parse(request.getOpeningTime()) : null)
                .closingTime(request.getClosingTime() != null ? LocalTime.parse(request.getClosingTime()) : null)
                .isOpen(true)
                .isActive(true)
                .build();
        
        if (!restaurant.isTwentyFourSeven() && (restaurant.getOpeningTime() == null || restaurant.getClosingTime() == null)) {
            throw new IllegalArgumentException("Opening and closing time are required unless the restaurant is open 24/7");
        }
        
        Restaurant saved = restaurantRepository.save(restaurant);
        return toResponse(saved);  
    }
    
    public List<RestaurantResponse> getMyRestaurants(UUID ownerId){
        return restaurantRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public RestaurantResponse getById(UUID restaurantId){
        Restaurant restaurant  = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        return toResponse(restaurant);
    }
    
    public RestaurantResponse updateRestaurant(UUID restaurantId, UUID ownerId, UpdateRestaurantRequest request){
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        
        if(!restaurant.getOwnerId().equals(ownerId)){
            throw new IllegalArgumentException("You Do not own this Restaurant");
        }
        
        if(request.getName() != null) restaurant.setName(request.getName());
        if(request.getDescription() != null) restaurant.setDescription(request.getDescription());
        if(request.getCuisineType() != null) restaurant.setCuisineType(request.getCuisineType());
        if(request.getAddressLine() != null) restaurant.setAddressLine(request.getAddressLine());
        if(request.getCity() != null) restaurant.setCity(request.getCity());
        if(request.getPincode() != null) restaurant.setPincode(request.getPincode());
        if (request.getOpeningTime() != null && !request.getOpeningTime().isBlank()){
            restaurant.setOpeningTime(LocalTime.parse(request.getOpeningTime()));
        }
        if (request.getClosingTime() != null && !request.getClosingTime().isBlank()){
            restaurant.setClosingTime(LocalTime.parse(request.getClosingTime()));
        }
        if (request.getIsOpen() != null) restaurant.setOpen(request.getIsOpen());
        if (request.getTwentyFourSeven() != null) restaurant.setTwentyFourSeven(request.getTwentyFourSeven());
        if (request.getRestaurantType() != null) {
            restaurant.setRestaurantType(RestaurantType.valueOf(request.getRestaurantType().toUpperCase()));
        }
        
        if (!restaurant.isTwentyFourSeven() && (restaurant.getOpeningTime() == null || restaurant.getClosingTime() == null)) {
            throw new IllegalArgumentException("Opening and closing time are required unless the restaurant is open 24/7");
        }

        Restaurant saved = restaurantRepository.save(restaurant);
        
        return toResponse(saved);
    }
    
    public Page<RestaurantResponse> browseRestaurants(String city, Pageable pageable) {
        Page<Restaurant> restaurants;
        if (city == null || city.isBlank()) {
            restaurants = restaurantRepository.findByIsActiveTrue(pageable);
        } else {
            restaurants = restaurantRepository.findByCityIgnoreCaseAndIsActiveTrue(city, pageable);
        }
        return restaurants.map(this::toResponse);
    }
    
    private RestaurantResponse toResponse(Restaurant r) {
        return RestaurantResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .description(r.getDescription())
                .cuisineType(r.getCuisineType())
                .restaurantType(r.getRestaurantType().name())
                .addressLine(r.getAddressLine())
                .city(r.getCity())
                .pincode(r.getPincode())
                .twentyFourSeven(r.isTwentyFourSeven())
                .openingTime(r.getOpeningTime() != null ? r.getOpeningTime().toString() : null)
                .closingTime(r.getClosingTime() != null ? r.getClosingTime().toString() : null)
                .isOpen(r.isOpen())
                .createdAt(r.getCreatedAt())
                .build();
    }
    
}
