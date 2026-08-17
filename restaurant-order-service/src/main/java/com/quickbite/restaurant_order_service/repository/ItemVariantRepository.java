package com.quickbite.restaurant_order_service.repository;

import com.quickbite.restaurant_order_service.entity.ItemVariant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemVariantRepository extends JpaRepository<ItemVariant, UUID> {
    List<ItemVariant> findByMenuItemId(UUID menuItemId);
}
