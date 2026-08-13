package com.quickbite.user_service.repository;

import com.quickbite.user_service.entity.CustomerProfile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;


public interface CustomerProfileRepository extends JpaRepository<CustomerProfile,UUID> {
    
}
