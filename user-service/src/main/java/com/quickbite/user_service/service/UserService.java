
package com.quickbite.user_service.service;

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
import com.quickbite.user_service.entity.Address;
import com.quickbite.user_service.entity.CustomerProfile;
import com.quickbite.user_service.entity.DeliveryPartnerProfile;
import com.quickbite.user_service.entity.RestaurantOwnerProfile;
import com.quickbite.user_service.repository.UserRepository;
import com.quickbite.user_service.entity.User;
import com.quickbite.user_service.repository.AddressRepository;
import com.quickbite.user_service.repository.CustomerProfileRepository;
import com.quickbite.user_service.repository.DeliveryPartnerProfileRepository;
import com.quickbite.user_service.repository.RestaurantOwnerProfileRepository;
import com.quickbite.user_service.security.JwtService;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final DeliveryPartnerProfileRepository deliveryPartnerProfileRepository;
    private final RestaurantOwnerProfileRepository restaurantOwnerProfileRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
            CustomerProfileRepository customerProfileRepository,
            DeliveryPartnerProfileRepository deliveryPartnerProfileRepository,
            RestaurantOwnerProfileRepository restaurantOwnerProfileRepository,
            PasswordEncoder passwordEncoder, 
            JwtService jwtService,
            AddressRepository addressRepository) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.deliveryPartnerProfileRepository = deliveryPartnerProfileRepository;
        this.restaurantOwnerProfileRepository = restaurantOwnerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.addressRepository = addressRepository;
    }
 
    

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(User.Role.CUSTOMER);

        User savedUser = userRepository.save(user);

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(savedUser);
        customerProfileRepository.save(profile);
        
        return toResponse(savedUser);
    }
    
    @Transactional
    public UserResponse registerRestaurantOwner(RegisterRestaurantOwnerRequest request){
        if(userRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("Email already registered");
        }
        
        User user = new User();
                user.setEmail(request.getEmail());
                user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                user.setFullName(request.getFullName());
                user.setPhone(request.getPhone());
                user.setRole(User.Role.RESTAURANT_OWNER);
                
                User savedUser = userRepository.save(user);
                
                RestaurantOwnerProfile profile = new RestaurantOwnerProfile();
                profile.setUser(savedUser);
                profile.setBusinessName(request.getBusinessName());
                restaurantOwnerProfileRepository.save(profile);
                
                return toResponse(savedUser);
    }
    
    @Transactional
    public UserResponse registerDeliveryPartner(RegisterDeliveryPartnerRequest request){
        if(userRepository.existsByEmail(request.getEmail())){
            throw new IllegalArgumentException("Email Already Exists");
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(User.Role.DELIVERY_PARTNER);
        
        User savedUser = userRepository.save(user);
        
        DeliveryPartnerProfile profile = new DeliveryPartnerProfile();
        profile.setUser(savedUser);
        profile.setVehicleType(request.getVehicleType());
        profile.setVehicleNumber(request.getVehicleNumber());
        deliveryPartnerProfileRepository.save(profile);
        
        return toResponse(savedUser);
        
    }
    
    public LoginResponse login(LoginRequest request){
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid Email Or Password"));
        if(!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())){
            throw new IllegalArgumentException("Invalid Email or Password");
        }
        
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        
        return new LoginResponse(token, user.getEmail(), user.getRole().name());
    }
    
    public Object getProfile(UUID userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User Not Found"));
        
        return switch(user.getRole()){
            case CUSTOMER ->{
                CustomerProfile profile = customerProfileRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
                yield new CustomerProfileResponse(user,profile);
            }
            case DELIVERY_PARTNER -> {
                DeliveryPartnerProfile profile = deliveryPartnerProfileRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
                yield new DeliveryPartnerProfileResponse(user,profile);
            }
            case RESTAURANT_OWNER ->{
                RestaurantOwnerProfile profile = restaurantOwnerProfileRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Profile not Found"));
                yield new RestaurantOwnerProfileResponse(user, profile);
            }
            case ADMIN -> toResponse(user);
            
        };
    }
    
    
    @Transactional
    public CustomerProfileResponse updateCustomerProfile(UUID userId, UpdateCustomerProfileRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if(user.getRole() != User.Role.CUSTOMER){
            throw new IllegalArgumentException("This Endpoint is only for customer account");
        }
        
        if(request.getFullName() != null) user.setFullName(request.getFullName());
        if(request.getPhone() != null) user.setPhone(request.getPhone());
        userRepository.save(user);
        
        CustomerProfile profile = customerProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile Not Found"));
        
        if(request.getGender() != null){
            profile.setGender(CustomerProfile.Gender.valueOf(request.getGender().toUpperCase()));
        }
        if(request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if(request.getProfilePicUrl() != null) profile.setProfilePicUrl(request.getProfilePicUrl());
        
        customerProfileRepository.save(profile);
        
        return new CustomerProfileResponse(user, profile);
        
    }
    
    @Transactional
    public DeliveryPartnerProfileResponse updateDeliveryPartnerProfile(UUID userId, UpdateDeliveryPartnerProfileRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if(user.getRole() != User.Role.DELIVERY_PARTNER){
            throw new IllegalArgumentException("This Endpoint is only for delivery partner accounts");
        }
        
        if(request.getFullName() != null) user.setFullName(request.getFullName());
        if(request.getPhone() != null) user.setPhone(request.getPhone());
        
        userRepository.save(user);
        
        DeliveryPartnerProfile profile = deliveryPartnerProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        
        if(request.getVehicleType() != null) profile.setVehicleType(request.getVehicleType());
        if(request.getVehicleNumber() != null) profile.setVehicleNumber(request.getVehicleNumber());
        if(request.getProfilePicUrl() != null) profile.setProfilePicUrl(request.getProfilePicUrl());
        
        deliveryPartnerProfileRepository.save(profile);
        
        return new DeliveryPartnerProfileResponse(user,profile);
    }

    @Transactional
    public RestaurantOwnerProfileResponse updateRestaunrantOwnerProfile(UUID userId, UpdateRestaurantOwnerProfileRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if(user.getRole() != User.Role.RESTAURANT_OWNER){
            throw new IllegalArgumentException("This Endpoint is only for restaurant owner accounts");
        }
        
        if(request.getFullName() != null) user.setFullName(request.getFullName());
        if(request.getPhone() != null) user.setPhone(request.getPhone());
        
        userRepository.save(user);
        
        RestaurantOwnerProfile profile = restaurantOwnerProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        
        if(request.getBusinessName() != null) profile.setBusinessName(request.getBusinessName());
        if(request.getLogoUrl() != null) profile.setLogoUrl(request.getLogoUrl());
        
        restaurantOwnerProfileRepository.save(profile);
        
        return new RestaurantOwnerProfileResponse(user, profile);
    }
    
    @Transactional
    public AddressResponse addAddress(UUID userId,AddressRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));
        
        Address address = new Address();
        address.setUser(user);
        address.setLabel(request.getLabel() != null
        ? Address.Label.valueOf(request.getLabel().toUpperCase())
                : Address.Label.HOME);
        address.setAddressLine(request.getAddressLine());
        address.setLandmark(request.getLandmark());
        address.setCity(request.getCity());
        address.setPincode(request.getPincode());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        
        if(Boolean.TRUE.equals(request.getIsDefault())){
            clearExistingDefault(userId);
            address.setIsDefault(true);
        }
        
        Address saved = addressRepository.save(address);
        
        return new AddressResponse(saved);
    }
    
    public List<AddressResponse> getAddresses(UUID userId){
        return addressRepository.findByUserId(userId)
                .stream()
                .map(AddressResponse::new)
                .toList();
    }
    
    @Transactional
    public void deleteAddress(UUID userId, UUID addressId){
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address Not found"));
        
        if(!address.getUser().getId().equals(userId)){
            throw new IllegalArgumentException("You can Only delete your own addresses");
        }
        
        addressRepository.delete(address);
    }
    
    private void clearExistingDefault(UUID userId){
        List<Address> addresses = addressRepository.findByUserId(userId);
        for(Address a: addresses){
            if(a.isDefault()){
                a.setIsDefault(false);
                addressRepository.save(a);
            }
        }
    }
    
    @Transactional
    public AddressResponse updateAddress(UUID userId, UUID addressId, AddressRequest request){
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Address Not found"));
        
        if(!address.getUser().getId().equals(userId)){
            throw new IllegalArgumentException("You can only update your own addresses");
        }
        
        if(request.getLabel() != null) address.setLabel(Address.Label.valueOf(request.getLabel().toUpperCase()));
        if (request.getAddressLine() != null) address.setAddressLine(request.getAddressLine());
        if (request.getLandmark() != null) address.setLandmark(request.getLandmark());
        if (request.getCity() != null) address.setCity(request.getCity());
        if (request.getPincode() != null) address.setPincode(request.getPincode());
        if (request.getLatitude() != null) address.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) address.setLongitude(request.getLongitude());
        
        if(Boolean.TRUE.equals(request.getIsDefault())){
            clearExistingDefault(userId);
            address.setIsDefault(true);
        }
         Address saved = addressRepository.save(address);
         return new AddressResponse(saved);
    }
    
    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}