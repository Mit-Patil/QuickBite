package com.quickbite.user_service.repository;

import com.quickbite.user_service.entity.DeliveryPartnerProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryPartnerProfileRepository extends JpaRepository<DeliveryPartnerProfile, UUID> {
}
