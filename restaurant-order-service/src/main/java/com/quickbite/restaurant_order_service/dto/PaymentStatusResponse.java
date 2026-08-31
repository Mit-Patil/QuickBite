package com.quickbite.restaurant_order_service.dto;

import lombok.Data;

@Data
public class PaymentStatusResponse {
    private String status;
    private String failureReason;
}
