package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "cart_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ItemVariant variant;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;
    
    @Column(name = "special_instructions")
    private String specialInstructions;

    @Column(name = "added_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime addedAt = LocalDateTime.now();
}
