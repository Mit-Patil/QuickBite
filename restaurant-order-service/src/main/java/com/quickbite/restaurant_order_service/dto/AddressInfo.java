package com.quickbite.restaurant_order_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AddressInfo(UUID id, Double latitude, Double longitude) {}