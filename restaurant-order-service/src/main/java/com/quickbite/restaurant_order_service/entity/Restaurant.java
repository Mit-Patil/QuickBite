package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "restaurants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;
    
    @Column(nullable = false)
    private String name;    
    
    private String description;
    private String cuisineType;

    @Column(name ="restaurant_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RestaurantType restaurantType;
    
    @Column(name = "address_line", nullable = false)
    private String addressLine;

    @Column(nullable = false)    
    private String city;     
    
    @Column(nullable = false)
    private String pincode;  
   
    private Double latitude;        
    private Double longitude;   

    @Column(name = "is_24_7", nullable = false)
    private boolean is24x7;
    
    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;    
    
    @Column(name = "is_open", nullable = false)
    private boolean isOpen;  
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;       
    
    @Column(name = "created_at", nullable = false,updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();      
    
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();      
    
    public enum RestaurantType{
        RESTAURANT,CLOUD_KITCHEN
    }
    
    @PreUpdate
    protected void onUpdate(){
        this.updatedAt = LocalDateTime.now();
    }
}
