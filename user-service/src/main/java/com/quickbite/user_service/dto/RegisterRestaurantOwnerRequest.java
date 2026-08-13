package com.quickbite.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

public class RegisterRestaurantOwnerRequest {
    
    
    @NotBlank(message = "Email Is Required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password is Required")
    @Size(min = 6, message = "Password Must Be At least 6 Characters")
    private String password;
    
    @NotBlank(message = "Full Name is Required")
    private String fullName;
    
    private String phone;
    
    @NotBlank(message = "Business name is Required")
    private String businessName;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }
    
    
    
}
