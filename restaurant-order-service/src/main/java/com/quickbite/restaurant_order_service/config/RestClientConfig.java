package com.quickbite.restaurant_order_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    @Primary
    public RestClient paymentServiceClient() {
        return build("http://localhost:8083", 5, 10);
    }

    @Bean
    public RestClient userRestClient(@Value("${user-service.url:http://127.0.0.1:8081}") String baseUrl) {
        return build(baseUrl, 3, 5);
    }

    private RestClient build(String baseUrl, int connectSeconds, int readSeconds) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(connectSeconds))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(readSeconds));
        return RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }
}