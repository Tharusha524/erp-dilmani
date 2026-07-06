<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Repositories\All\Customer\CustomerInterface;

class CustomerController extends Controller
{
    private CustomerInterface $customerRepository;

    public function __construct(CustomerInterface $customerRepository)
    {
        $this->customerRepository = $customerRepository;
    }

    public function index()
    {
        return response()->json($this->customerRepository->all());
    }

    public function store(CustomerRequest $request)
    {
        $customer = $this->customerRepository->create($request->validated());
        return response()->json($customer, 201);
    }

    public function show($id)
    {
        $customer = $this->customerRepository->find($id);

        if (!$customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        return response()->json($customer);
    }

    public function update(CustomerRequest $request, $id)
    {
        $customer = $this->customerRepository->update($id, $request->validated());

        if (!$customer) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        return response()->json($customer);
    }

    public function destroy($id)
    {
        $deleted = $this->customerRepository->delete($id);

        if (!$deleted) {
            return response()->json(['message' => 'Customer not found'], 404);
        }

        return response()->json(['message' => 'Customer deleted']);
    }
}
