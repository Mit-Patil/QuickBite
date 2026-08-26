package com.quickbite.restaurant_order_service.dto;

import lombok.Data;

@Data
public class PaymentResponse {
    private String orderId;
    private String status;
    private String transactionRef;
    private String failureReason;
}
