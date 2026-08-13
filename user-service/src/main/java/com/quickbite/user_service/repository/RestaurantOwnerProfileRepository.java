package com.quickbite.user_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import com.quickbite.user_service.entity.RestaurantOwnerProfile;

public interface RestaurantOwnerProfileRepository extends JpaRepository<RestaurantOwnerProfile, UUID> {
    
}
