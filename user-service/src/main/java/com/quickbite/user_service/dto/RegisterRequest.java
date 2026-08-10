
package com.quickbite.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    
    @NotBlank(message = "Email Required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password Required")
    @Size(min = 6, message  = "Password Must be 6 Characters")
    private String password;
    
    @NotBlank(message = "Full Name is Required")
    private String fullName;
    
    private String phone;
    

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

    
    
}
