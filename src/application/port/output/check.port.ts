import Check from "@/domain/entities/check";

interface CheckOutputPort {
    check(): Promise<Check>;
}   

export default CheckOutputPort;