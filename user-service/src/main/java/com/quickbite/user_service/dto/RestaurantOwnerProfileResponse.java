
package com.quickbite.user_service.dto;

import com.quickbite.user_service.entity.RestaurantOwnerProfile;
import com.quickbite.user_service.entity.User;
import java.time.LocalDateTime;
import java.util.UUID;

public class RestaurantOwnerProfileResponse {
 
    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
    
    private String businessName;
    private String logoUrl;
    private String verificationStatus;
    
    
    public RestaurantOwnerProfileResponse(User user, RestaurantOwnerProfile profile) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.role = user.getRole().name();
        this.createdAt = user.getCreatedAt();

        this.businessName = profile.getBusinessName();
        this.logoUrl = profile.getLogoUrl();
        this.verificationStatus = profile.getVerificationStatus().name();
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

    public String getBusinessName() {
        return businessName;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }
    
    
    
}


