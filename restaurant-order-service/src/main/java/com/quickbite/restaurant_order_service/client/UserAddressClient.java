package com.quickbite.restaurant_order_service.client;

import com.quickbite.restaurant_order_service.dto.AddressInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.UUID;

@Component
public class UserAddressClient {

    private static final Logger log = LoggerFactory.getLogger(UserAddressClient.class);
    private static final ParameterizedTypeReference<List<AddressInfo>> ADDRESS_LIST =
            new ParameterizedTypeReference<>() {};

    private final RestClient userRestClient;

    public UserAddressClient(@Qualifier("userRestClient") RestClient userRestClient) {
        this.userRestClient = userRestClient;
    }

    public AddressInfo getAddress(String authToken, UUID addressId) {
        List<AddressInfo> addresses;
        try {
            addresses = userRestClient.get()
                    .uri("/api/users/me/addresses")
                    .header("Authorization", authToken)
                    .retrieve()
                    .body(ADDRESS_LIST);
        } catch (RestClientException e) {
            log.error("Address lookup failed: {}", e.getMessage());
            throw new IllegalStateException("Could not verify the delivery address right now, please try again");
        }
        if (addresses == null) {
            throw new IllegalArgumentException("Delivery address not found");
        }
        return addresses.stream()
                .filter(a -> addressId.equals(a.id()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Delivery address not found"));
    }
}