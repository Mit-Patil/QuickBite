package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;
    
    @Column(nullable = false)
    private String name; 
        
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;    
    
    private String category;     
    
    @Column(name="is_veg", nullable = false)
    private boolean isVeg;       
    
    @Column(name= "is_available", nullable = false)
    private boolean isAvailable; 
    
    @Column(name = "stock_quantity")
    private Integer stockQuantity;
    
    @Column(name = "image_url")
    private String imageUrl;   
    
    @Column(name = "created_at",nullable = false, updatable = false)
    @Builder.Default        
    private LocalDateTime createdAt = LocalDateTime.now();    
    
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate(){
        updatedAt = LocalDateTime.now();
    }

}
