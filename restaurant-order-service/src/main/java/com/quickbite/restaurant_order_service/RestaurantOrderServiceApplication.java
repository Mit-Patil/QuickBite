package com.quickbite.restaurant_order_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class RestaurantOrderServiceApplication {

	public static void main(String[] args) {
                    System.setProperty("user.timezone", "Asia/Kolkata");
		SpringApplication.run(RestaurantOrderServiceApplication.class, args);
	}

}
