"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, ModalFooter, Button, Input, Select } from "@/components/ui";
import { UNIT_STATUSES } from "@/lib/constants";
import type { UnitData } from "@/components/properties/UnitCard";

const unitSchema = z.object({
  label: z.string().min(1, "Unit label is required"),
  bedrooms: z.coerce.number().int().min(0).optional().or(z.literal("")),
  bathrooms: z.coerce.number().min(0).optional().or(z.literal("")),
  squareFootage: z.coerce.number().int().min(0).optional().or(z.literal("")),
  status: z.string().default("VACANT"),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  unit?: UnitData | null;
  onSuccess: () => void;
}

const statusOptions = UNIT_STATUSES.map((s) => ({
  value: s.value.toUpperCase(),
  label: s.label,
}));

export function AddUnitModal({
  isOpen,
  onClose,
  propertyId,
  unit,
  onSuccess,
}: AddUnitModalProps) {
  const isEditing = !!unit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(unitSchema) as any,
    defaultValues: {
      label: "",
      bedrooms: "",
      bathrooms: "",
      squareFootage: "",
      status: "VACANT",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (unit) {
        reset({
          label: unit.label,
          bedrooms: unit.bedrooms ?? "",
          bathrooms: unit.bathrooms != null ? Number(unit.bathrooms) : "",
          squareFootage: unit.squareFootage ?? "",
          status: unit.status.toUpperCase(),
        });
      } else {
        reset({
          label: "",
          bedrooms: "",
          bathrooms: "",
          squareFootage: "",
          status: "VACANT",
        });
      }
    }
  }, [isOpen, unit, reset]);

  async function onSubmit(data: UnitFormValues) {
    const payload = {
      label: data.label,
      bedrooms: data.bedrooms === "" ? null : Number(data.bedrooms),
      bathrooms: data.bathrooms === "" ? null : Number(data.bathrooms),
      squareFootage:
        data.squareFootage === "" ? null : Number(data.squareFootage),
      status: data.status,
    };

    const url = isEditing
      ? `/api/properties/${propertyId}/units/${unit!.id}`
      : `/api/properties/${propertyId}/units`;

    const res = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to save unit");
    }

    onSuccess();
    onClose();
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Unit" : "Add Unit"}
      description={
        isEditing
          ? "Update the details for this unit."
          : "Add a new unit to this property."
      }
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Unit Label"
          placeholder="e.g. Unit A, Suite 101"
          error={errors.label?.message}
          {...register("label")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Bedrooms"
            type="number"
            min={0}
            placeholder="0"
            error={errors.bedrooms?.message}
            {...register("bedrooms")}
          />
          <Input
            label="Bathrooms"
            type="number"
            min={0}
            step={0.5}
            placeholder="0"
            error={errors.bathrooms?.message}
            {...register("bathrooms")}
          />
        </div>

        <Input
          label="Square Footage"
          type="number"
          min={0}
          placeholder="0"
          error={errors.squareFootage?.message}
          {...register("squareFootage")}
        />

        <Select
          label="Status"
          options={statusOptions}
          error={errors.status?.message}
          {...register("status")}
        />

        <ModalFooter className="px-0 border-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} loadingText="Saving...">
            {isEditing ? "Save Changes" : "Add Unit"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
