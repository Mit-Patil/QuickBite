
package com.quickbite.user_service.service;

import com.quickbite.user_service.dto.CustomerProfileResponse;
import com.quickbite.user_service.dto.DeliveryPartnerProfileResponse;
import com.quickbite.user_service.dto.LoginRequest;
import com.quickbite.user_service.dto.LoginResponse;
import com.quickbite.user_service.dto.RegisterDeliveryPartnerRequest;
import com.quickbite.user_service.dto.RegisterRequest;
import com.quickbite.user_service.dto.RegisterRestaurantOwnerRequest;
import com.quickbite.user_service.dto.RestaurantOwnerProfileResponse;
import com.quickbite.user_service.dto.UserResponse;
import com.quickbite.user_service.entity.CustomerProfile;
import com.quickbite.user_service.entity.DeliveryPartnerProfile;
import com.quickbite.user_service.entity.RestaurantOwnerProfile;
import com.quickbite.user_service.repository.UserRepository;
import com.quickbite.user_service.entity.User;
import com.quickbite.user_service.repository.CustomerProfileRepository;
import com.quickbite.user_service.repository.DeliveryPartnerProfileRepository;
import com.quickbite.user_service.repository.RestaurantOwnerProfileRepository;
import com.quickbite.user_service.security.JwtService;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final DeliveryPartnerProfileRepository deliveryPartnerProfileRepository;
    private final RestaurantOwnerProfileRepository restaurantOwnerProfileRepository;   
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
            CustomerProfileRepository customerProfileRepository,
            DeliveryPartnerProfileRepository deliveryPartnerProfileRepository,
            RestaurantOwnerProfileRepository restaurantOwnerProfileRepository,
            PasswordEncoder passwordEncoder, 
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.deliveryPartnerProfileRepository = deliveryPartnerProfileRepository;
        this.restaurantOwnerProfileRepository = restaurantOwnerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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