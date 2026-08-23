package com.quickbite.restaurant_order_service.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class AttachAddonRequest {
    private UUID addonId;
}