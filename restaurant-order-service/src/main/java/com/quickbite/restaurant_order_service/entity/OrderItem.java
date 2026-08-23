package com.quickbite.restaurant_order_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "variant_name")
    private String variantName;

    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "special_instructions")
    private String specialInstructions;
    
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "addons_total", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal addonsTotal = BigDecimal.ZERO;

    @Column(name = "line_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;
}
