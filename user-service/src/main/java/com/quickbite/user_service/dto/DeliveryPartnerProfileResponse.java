
package com.quickbite.user_service.dto;

import com.quickbite.user_service.entity.DeliveryPartnerProfile;
import com.quickbite.user_service.entity.User;
import java.time.LocalDateTime;
import java.util.UUID;


public class DeliveryPartnerProfileResponse {
    
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private LocalDateTime createdAt;

    private String vehicleType;
    private String vehicleNumber;
    private String profilePicUrl;
    private String verificationStatus;
    private boolean available;
    
    
        public DeliveryPartnerProfileResponse(User user, DeliveryPartnerProfile profile) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.role = user.getRole().name();
        this.createdAt = user.getCreatedAt();

        this.vehicleType = profile.getVehicleType();
        this.vehicleNumber = profile.getVehicleNumber();
        this.profilePicUrl = profile.getProfilePicUrl();
        this.verificationStatus = profile.getVerificationStatus().name();
        this.available = profile.isAvailable();
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

    public String getVehicleType() {
        return vehicleType;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public String getProfilePicUrl() {
        return profilePicUrl;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public boolean isAvailable() {
        return available;
    }
        
    
}
