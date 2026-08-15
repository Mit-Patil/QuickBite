
package com.quickbite.user_service.controller;

import com.quickbite.user_service.dto.AddressRequest;
import com.quickbite.user_service.dto.AddressResponse;
import com.quickbite.user_service.dto.CustomerProfileResponse;
import com.quickbite.user_service.dto.DeliveryPartnerProfileResponse;
import com.quickbite.user_service.dto.LoginRequest;
import com.quickbite.user_service.dto.LoginResponse;
import com.quickbite.user_service.dto.RegisterDeliveryPartnerRequest;
import com.quickbite.user_service.dto.RegisterRequest;
import com.quickbite.user_service.dto.RegisterRestaurantOwnerRequest;
import com.quickbite.user_service.dto.RestaurantOwnerProfileResponse;
import com.quickbite.user_service.dto.UpdateCustomerProfileRequest;
import com.quickbite.user_service.dto.UpdateDeliveryPartnerProfileRequest;
import com.quickbite.user_service.dto.UpdateRestaurantOwnerProfileRequest;
import com.quickbite.user_service.dto.UserResponse;
import com.quickbite.user_service.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    
    public UserController(UserService userService)
    {
        this.userService = userService;
    }
    
    private UUID getCurrentUserId(){
        var authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();
        
        return UUID.fromString((String) authentication.getPrincipal());
    }
    
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request){
        UserResponse response  = userService.register(request);
        return ResponseEntity.status(201).body(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
        LoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> me(){
      return ResponseEntity.ok(userService.getProfile(getCurrentUserId()));
    }
    
    
    @PostMapping("/register/restaurant-owner")
    public ResponseEntity<UserResponse> registerRestaurantOwner(@Valid @RequestBody RegisterRestaurantOwnerRequest request){
        UserResponse response = userService.registerRestaurantOwner(request);
        return ResponseEntity.status(201).body(response);
    }
    
    @PostMapping("/register/delivery-partner")
    public ResponseEntity<UserResponse> registerDeliveryPartner(@Valid @RequestBody RegisterDeliveryPartnerRequest request){
        
        UserResponse response = userService.registerDeliveryPartner(request);
        return ResponseEntity.status(201).body(response);
        
    }
    
    @PreAuthorize("hasRole('CUSTOMER')")
    @PutMapping("/me/customer")
    public ResponseEntity<CustomerProfileResponse> updateCustomerProfile(@RequestBody UpdateCustomerProfileRequest request){
        return ResponseEntity.ok(userService.updateCustomerProfile(getCurrentUserId(), request));
    }
    
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    @PutMapping("/me/delivery-partner")
    public ResponseEntity<DeliveryPartnerProfileResponse> updateDeliveryPartnerProfile(@RequestBody UpdateDeliveryPartnerProfileRequest request){
        return ResponseEntity.ok(userService.updateDeliveryPartnerProfile(getCurrentUserId(), request));
    }
    
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    @PutMapping("/me/restaurant-owner")
    public ResponseEntity<RestaurantOwnerProfileResponse> updateRestaunrantOwnerProfile(@RequestBody UpdateRestaurantOwnerProfileRequest request){
        return ResponseEntity.ok(userService.updateRestaunrantOwnerProfile(getCurrentUserId(), request));
    }
    
    @PostMapping("/me/addresses")
    public ResponseEntity<AddressResponse> addAddress(@Valid @RequestBody AddressRequest request){
        AddressResponse response = userService.addAddress(getCurrentUserId(), request);
        return ResponseEntity.status(201).body(response);
    }
    
    @GetMapping("/me/addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(){
        return ResponseEntity.ok(userService.getAddresses(getCurrentUserId()));
    }
    
    @DeleteMapping("/me/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable UUID addressId){
        userService.deleteAddress(getCurrentUserId(), addressId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/me/addresses/{addressId}")
    public ResponseEntity<AddressResponse> updateAddress(@PathVariable UUID addressId,@RequestBody AddressRequest request){
        return  ResponseEntity.ok(userService.updateAddress(getCurrentUserId(), addressId, request));
    }
    
}
