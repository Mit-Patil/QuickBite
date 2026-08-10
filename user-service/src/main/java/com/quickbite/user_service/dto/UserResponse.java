/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.quickbite.user_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserResponse {
    
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
    
    
    public UserResponse(UUID id, String email, String fullName, String phone, String role, LocalDateTime createdAt)
    {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.role = role;
        this.createdAt = createdAt;
    }
    
    public UUID getId(){ return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public String getRole() { return role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
