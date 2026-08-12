
package com.quickbite.user_service.controller;

import com.quickbite.user_service.dto.LoginRequest;
import com.quickbite.user_service.dto.LoginResponse;
import com.quickbite.user_service.dto.RegisterRequest;
import com.quickbite.user_service.dto.UserResponse;
import com.quickbite.user_service.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    
    public UserController(UserService userService)
    {
        this.userService = userService;
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
    public ResponseEntity<String> me(){
        var authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication();
        
        String userId = (String) authentication.getPrincipal();
        String role = authentication.getAuthorities().iterator().next().getAuthority();
        
        return ResponseEntity.ok("You Are user " + userId + " With " + role);
    }
    
}
