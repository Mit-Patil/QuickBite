
package com.quickbite.user_service.service;

import com.quickbite.user_service.dto.LoginRequest;
import com.quickbite.user_service.dto.LoginResponse;
import com.quickbite.user_service.dto.RegisterRequest;
import com.quickbite.user_service.dto.UserResponse;
import com.quickbite.user_service.repository.UserRepository;
import com.quickbite.user_service.entity.User;
import com.quickbite.user_service.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

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