
package com.quickbite.user_service.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
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
import com.quickbite.user_service.dto.UpdateLocationRequest;
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
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.regex.Pattern;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final DeliveryPartnerProfileRepository deliveryPartnerProfileRepository;
    private final RestaurantOwnerProfileRepository restaurantOwnerProfileRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Cloudinary cloudinary;
        
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    private static final double INDIA_MIN_LAT = 6.0, INDIA_MAX_LAT = 38.0;
    private static final double INDIA_MIN_LNG = 68.0, INDIA_MAX_LNG = 98.0;
    
    public UserService(UserRepository userRepository,
            CustomerProfileRepository customerProfileRepository,
            DeliveryPartnerProfileRepository deliveryPartnerProfileRepository,
            RestaurantOwnerProfileRepository restaurantOwnerProfileRepository,
            PasswordEncoder passwordEncoder, 
            JwtService jwtService,
            AddressRepository addressRepository,
            Cloudinary cloudinary) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.deliveryPartnerProfileRepository = deliveryPartnerProfileRepository;
        this.restaurantOwnerProfileRepository = restaurantOwnerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.addressRepository = addressRepository;
        this.cloudinary = cloudinary;
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
    
    public CustomerProfileResponse uploadProfilePicture(UUID userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map uploadResult;
        try {
            uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", "quickbite/customer-profiles"));
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to upload image");
        }

        String imageUrl = (String) uploadResult.get("secure_url");

        CustomerProfile profile = customerProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        profile.setProfilePicUrl(imageUrl);
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
    public DeliveryPartnerProfileResponse updateDeliveryPartnerLocation(UUID userId, UpdateLocationRequest request) {
        validateCoordinates(request.getLatitude(), request.getLongitude());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() != User.Role.DELIVERY_PARTNER) {
            throw new IllegalArgumentException("This Endpoint is only for delivery partner accounts");
        }

        DeliveryPartnerProfile profile = deliveryPartnerProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        profile.setCurrentLat(request.getLatitude());
        profile.setCurrentLng(request.getLongitude());
        deliveryPartnerProfileRepository.save(profile);

        return new DeliveryPartnerProfileResponse(user, profile);
    }
    
    public DeliveryPartnerProfileResponse uploadDeliveryPartnerPicture(UUID userId, MultipartFile file){
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        Map uploadResult;
        try {
            uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", "quickbite/delivery-partner-profiles"));
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to uplaod image");
        }
              
        String imgUrl = (String) uploadResult.get("secure_url");
        
        DeliveryPartnerProfile profile = deliveryPartnerProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("profile not found"));
        
        profile.setProfilePicUrl(imgUrl);
        deliveryPartnerProfileRepository.save(profile);
        
        return new DeliveryPartnerProfileResponse(user, profile);
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
    
    public RestaurantOwnerProfileResponse uploadRestaurantLogo(UUID userId, MultipartFile file){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Map uploadResult;
        try {
            uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", "quickbite/restaurant-logos"));
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to upload logo image.");
        }
        
        String logoUrl = (String) uploadResult.get("secure_url");
        
        RestaurantOwnerProfile profile = restaurantOwnerProfileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        profile.setLogoUrl(logoUrl);
        
        restaurantOwnerProfileRepository.save(profile);
        
        return new RestaurantOwnerProfileResponse(user, profile);
    }
    
    @Transactional
    public AddressResponse addAddress(UUID userId,AddressRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user not found"));
        
        validateCoordinates(request.getLatitude(), request.getLongitude());
        validatePincode(request.getPincode());
        
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
    
    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Please pin your location on the map");
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Invalid map coordinates");
        }
        if (latitude < INDIA_MIN_LAT || latitude > INDIA_MAX_LAT
                || longitude < INDIA_MIN_LNG || longitude > INDIA_MAX_LNG) {
            throw new IllegalArgumentException("Location must be within India");
        }
    }

    private void validatePincode(String pincode) {
        if (pincode == null || !PINCODE_PATTERN.matcher(pincode).matches()) {
            throw new IllegalArgumentException("Pincode must be a valid 6-digit number");
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
        if (request.getAddressLine() != null && !request.getAddressLine().isBlank()) {
            address.setAddressLine(request.getAddressLine());
        }
        if (request.getLandmark() != null) address.setLandmark(request.getLandmark());
        if (request.getCity() != null && !request.getCity().isBlank()) {
            address.setCity(request.getCity());
        }
        if (request.getPincode() != null && !request.getPincode().isBlank()) {
            validatePincode(request.getPincode());
            address.setPincode(request.getPincode());
        }
        if (request.getLatitude() != null || request.getLongitude() != null) {
            validateCoordinates(request.getLatitude(), request.getLongitude());
            address.setLatitude(request.getLatitude());
            address.setLongitude(request.getLongitude());
        }
        
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