package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "order_item_addons")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItemAddon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(name = "addon_name", nullable = false)
    private String addonName;

    @Column(name = "addon_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal addonPrice;
}