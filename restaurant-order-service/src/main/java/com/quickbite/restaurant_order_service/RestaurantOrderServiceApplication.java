package com.quickbite.restaurant_order_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RestaurantOrderServiceApplication {

	public static void main(String[] args) {
                    System.setProperty("user.timezone", "Asia/Kolkata");
		SpringApplication.run(RestaurantOrderServiceApplication.class, args);
	}

}
