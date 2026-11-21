package com.quickbite.restaurant_order_service.dto;

import java.math.BigDecimal;

public record DeliveryQuoteResponse(BigDecimal distanceKm, BigDecimal deliveryFee) {}