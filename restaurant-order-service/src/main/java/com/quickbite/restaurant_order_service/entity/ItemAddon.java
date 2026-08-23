package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import java.util.UUID;


@Entity
@Table(name = "item_addons")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ItemAddon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;
    
    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private boolean isAvailable = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
