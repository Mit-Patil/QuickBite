package com.quickbite.user_service.repository;

import com.quickbite.user_service.entity.Address;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address,UUID> {
    
    List<Address> findByUserId(UUID userId);
    
}
