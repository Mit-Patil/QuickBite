package com.quickbite.restaurant_order_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
    
    @Bean
    public RestClient paymentServiceClient(){
        return RestClient.builder()
                .baseUrl("http://localhost:8083")
                .build();
    }
}
