package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "item_variants")
public class ItemVariant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;   
    
    @Column(nullable = false)
    private String name;            
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;           
    
    @Column(name = "is_default", nullable = false)
    private boolean isDefault;      
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;       
    
    @PrePersist
    protected void onCreate(){
        this.createdAt = LocalDateTime.now();
    }
}
