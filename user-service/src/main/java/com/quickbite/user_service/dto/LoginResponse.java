/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.quickbite.user_service.dto;

/**
 *
 * @author patil
 */
public class LoginResponse {
 
    private String token;
    private String email;
    private String role;
    
    public LoginResponse(String token, String email, String role){
        this.token = token;
        this.email = email;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
    
    
}
