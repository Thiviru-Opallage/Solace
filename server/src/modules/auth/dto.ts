import { UserEntity } from "../../repositories/types.js";
import { decryptField, maskSensitiveValue } from "../../crypto/fieldEncryption.js";

export interface UserDto {
  _id: string;
  name: string;
  email: string;
  role: UserEntity["role"];
  phone?: string;
  nic?: string;
  clearance?: UserEntity["clearance"];
  createdAt: string;
}

export function toUserDto(user: UserEntity, options: { revealSensitive?: boolean } = {}): UserDto {
  let phone: string | undefined;
  let nic: string | undefined;

  if (options.revealSensitive) {
    phone = decryptField(user.phoneEncrypted);
    nic = decryptField(user.nicEncrypted);
  } else {
    // Return masked values
    const rawPhone = decryptField(user.phoneEncrypted);
    const rawNic = decryptField(user.nicEncrypted);
    phone = rawPhone ? maskSensitiveValue(rawPhone) : undefined;
    nic = rawNic ? maskSensitiveValue(rawNic) : undefined;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone,
    nic,
    clearance: user.clearance,
    createdAt: user.createdAt,
  };
}
