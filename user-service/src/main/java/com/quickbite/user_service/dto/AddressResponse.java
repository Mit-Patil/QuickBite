package com.quickbite.user_service.dto;

import com.quickbite.user_service.entity.Address;
import java.util.UUID;

public class AddressResponse {
  
    private UUID id;
    private String label;
    private String addressLine;
    private String landmark;
    private String city;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private Boolean isDefault;
    
    public AddressResponse(Address address){
        this.id = address.getId();
        this.label = address.getLabel().name();
        this.addressLine = address.getAddressLine();
        this.landmark = address.getLandmark();
        this.city = address.getCity();
        this.pincode = address.getPincode();
        this.latitude = address.getLatitude();
        this.longitude = address.getLongitude();
        this.isDefault = address.isDefault();
    }

    public UUID getId() {
        return id;
    }

    public String getLabel() {
        return label;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public String getLandmark() {
        return landmark;
    }

    public String getCity() {
        return city;
    }

    public String getPincode() {
        return pincode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }
    
}
