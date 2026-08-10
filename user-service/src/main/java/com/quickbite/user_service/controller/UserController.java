
package com.quickbite.user_service.controller;

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
}
