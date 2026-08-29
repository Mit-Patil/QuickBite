package com.quickbite.restaurant_order_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {
    
    @NotBlank(message = "Status is Required")
    private String status;
    
}
