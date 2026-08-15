package com.quickbite.user_service.dto;

import com.quickbite.user_service.entity.CustomerProfile;
import com.quickbite.user_service.entity.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;


public class CustomerProfileResponse {
    
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
    
    private String gender;
    private LocalDate dateOfBirth;
    private String profilePicUrl;

    public CustomerProfileResponse(User user,CustomerProfile profile){
        
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.role = user.getRole().name();
        this.createdAt = user.getCreatedAt();

        this.gender = profile.getGender() != null ? profile.getGender().name() : null;
        this.dateOfBirth = profile.getDateOfBirth();
        this.profilePicUrl = profile.getProfilePicUrl();
        
    }    

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhone() {
        return phone;
    }

    public String getRole() {
        return role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getGender() {
        return gender;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getProfilePicUrl() {
        return profilePicUrl;
    }

}
