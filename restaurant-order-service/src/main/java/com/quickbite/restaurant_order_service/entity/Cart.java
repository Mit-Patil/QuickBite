
package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "carts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "customer_id", nullable = false, unique = true)
    private UUID customerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "processing", nullable = false)
    @Builder.Default
    private boolean processing = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}